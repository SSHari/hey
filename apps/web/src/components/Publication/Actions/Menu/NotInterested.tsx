import { Menu } from '@headlessui/react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { PUBLICATION } from '@hey/data/tracking';
import type {
  Publication,
  PublicationProfileNotInterestedRequest
} from '@hey/lens';
import {
  useAddPublicationProfileNotInterestedMutation,
  useRemovePublicationProfileNotInterestedMutation
} from '@hey/lens';
import type { ApolloCache } from '@hey/lens/apollo';
import { publicationKeyFields } from '@hey/lens/apollo/lib';
import stopEventPropagation from '@hey/lib/stopEventPropagation';
import cn from '@hey/ui/cn';
import errorToast from '@lib/errorToast';
import { Leafwatch } from '@lib/leafwatch';
import { t } from '@lingui/macro';
import type { FC } from 'react';
import { toast } from 'react-hot-toast';
import { useAppStore } from 'src/store/app';

interface NotInterestedProps {
  publication: Publication;
}

const NotInterested: FC<NotInterestedProps> = ({ publication }) => {
  const isMirror = publication.__typename === 'Mirror';
  const notInterested = isMirror
    ? publication.mirrorOf.notInterested
    : publication.notInterested;
  const currentProfile = useAppStore((state) => state.currentProfile);
  const request: PublicationProfileNotInterestedRequest = {
    profileId: currentProfile?.id,
    publicationId: publication.id
  };

  const updateCache = (cache: ApolloCache<any>, notInterested: boolean) => {
    cache.modify({
      id: publicationKeyFields(isMirror ? publication?.mirrorOf : publication),
      fields: { notInterested: () => notInterested }
    });
  };

  const onError = (error: any) => {
    errorToast(error);
  };

  const [addPublicationProfileNotInterested] =
    useAddPublicationProfileNotInterestedMutation({
      variables: { request },
      onError,
      onCompleted: () => {
        toast.success(t`Marked as not Interested`);
        Leafwatch.track(PUBLICATION.TOGGLE_NOT_INTERESTED, {
          publication_id: publication.id,
          not_interested: true
        });
      },
      update: (cache) => updateCache(cache, true)
    });

  const [removePublicationProfileNotInterested] =
    useRemovePublicationProfileNotInterestedMutation({
      variables: { request },
      onError,
      onCompleted: () => {
        toast.success(t`Undo Not interested`);
        Leafwatch.track(PUBLICATION.TOGGLE_NOT_INTERESTED, {
          publication_id: publication.id,
          not_interested: false
        });
      },
      update: (cache) => updateCache(cache, false)
    });

  const togglePublicationProfileNotInterested = async () => {
    if (notInterested) {
      return await removePublicationProfileNotInterested();
    }

    return await addPublicationProfileNotInterested();
  };

  return (
    <Menu.Item
      as="div"
      className={({ active }) =>
        cn(
          { 'dropdown-active': active },
          'm-2 block cursor-pointer rounded-lg px-2 py-1.5 text-sm'
        )
      }
      onClick={(event) => {
        stopEventPropagation(event);
        togglePublicationProfileNotInterested();
      }}
    >
      <div className="flex items-center space-x-2">
        {notInterested ? (
          <>
            <EyeIcon className="h-4 w-4" />
            <div>Undo Not interested</div>
          </>
        ) : (
          <>
            <EyeSlashIcon className="h-4 w-4" />
            <div>Not interested</div>
          </>
        )}
      </div>
    </Menu.Item>
  );
};

export default NotInterested;
